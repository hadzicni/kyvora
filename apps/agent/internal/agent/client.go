package agent

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const requestTimeout = 10 * time.Second

type Client struct {
	baseURL       *url.URL
	loginEmail    string
	loginPassword string
	accessToken   string
	refreshToken  string
	tokenType     string
	expiresAt     time.Time
	httpClient    *http.Client
}

type Agent struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Hostname string `json:"hostname"`
	Version  string `json:"version"`
	Status   string `json:"status"`
}

type registerRequest struct {
	Name     string `json:"name"`
	Hostname string `json:"hostname"`
	Version  string `json:"version"`
}

type heartbeatRequest struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type tokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	TokenType    string `json:"tokenType"`
	ExpiresIn    int64  `json:"expiresIn"`
}

type apiErrorResponse struct {
	Status  int      `json:"status"`
	Error   string   `json:"error"`
	Message string   `json:"message"`
	Path    string   `json:"path"`
	Details []string `json:"details"`
}

type apiError struct {
	statusCode int
	body       apiErrorResponse
	rawBody    string
}

func (e *apiError) Error() string {
	if e.body.Message != "" {
		return e.body.Message
	}
	if e.rawBody != "" {
		return e.rawBody
	}
	return fmt.Sprintf("Kyvora API returned HTTP %d", e.statusCode)
}

type DuplicateHostnameError struct {
	Hostname string
	Details  []string
	Message  string
}

func (e *DuplicateHostnameError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "agent hostname already exists"
}

func NewClient(cfg Config) (*Client, error) {
	baseURL, err := url.Parse(cfg.APIURL)
	if err != nil {
		return nil, fmt.Errorf("parse KYVORA_API_URL: %w", err)
	}
	if baseURL.Scheme == "" || baseURL.Host == "" {
		return nil, fmt.Errorf("KYVORA_API_URL must include scheme and host")
	}

	return &Client{
		baseURL:       baseURL,
		loginEmail:    cfg.APILoginEmail,
		loginPassword: cfg.APILoginPassword,
		tokenType:     "Bearer",
		httpClient:    &http.Client{},
	}, nil
}

func (c *Client) Authenticate(ctx context.Context) error {
	return c.login(ctx)
}

func (c *Client) Register(ctx context.Context, cfg Config) (Agent, error) {
	var registered Agent
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/agents/register", registerRequest{
		Name:     cfg.Name,
		Hostname: cfg.Hostname,
		Version:  cfg.Version,
	}, &registered)
	if err == nil {
		return registered, nil
	}

	var apiErr *apiError
	if errors.As(err, &apiErr) && apiErr.statusCode == http.StatusConflict {
		return Agent{}, &DuplicateHostnameError{
			Hostname: cfg.Hostname,
			Details:  apiErr.body.Details,
			Message:  apiErr.body.Message,
		}
	}

	return Agent{}, err
}

func (c *Client) Heartbeat(ctx context.Context, agentID, version string) (Agent, error) {
	var updated Agent
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/agents/"+url.PathEscape(agentID)+"/heartbeat", heartbeatRequest{
		Status:  "ONLINE",
		Version: version,
	}, &updated)
	return updated, err
}

func (c *Client) doJSON(ctx context.Context, method, path string, body any, out any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("encode request: %w", err)
	}

	if err := c.ensureAuthenticated(ctx); err != nil {
		return err
	}

	statusCode, responseBody, err := c.sendJSON(ctx, method, path, payload, true)
	if err != nil {
		return err
	}

	if statusCode == http.StatusUnauthorized {
		if err := c.refreshOrLogin(ctx); err != nil {
			return err
		}
		statusCode, responseBody, err = c.sendJSON(ctx, method, path, payload, true)
		if err != nil {
			return err
		}
	}

	return decodeAPIResponse(statusCode, responseBody, out)
}

func (c *Client) ensureAuthenticated(ctx context.Context) error {
	if c.accessToken != "" && time.Now().Before(c.expiresAt) {
		return nil
	}
	if c.refreshToken != "" {
		return c.refreshOrLogin(ctx)
	}
	return c.login(ctx)
}

func (c *Client) refreshOrLogin(ctx context.Context) error {
	if c.refreshToken != "" {
		if err := c.refresh(ctx); err == nil {
			return nil
		}
	}
	return c.login(ctx)
}

func (c *Client) login(ctx context.Context) error {
	return c.requestTokens(ctx, "/api/v1/auth/login", loginRequest{
		Email:    c.loginEmail,
		Password: c.loginPassword,
	})
}

func (c *Client) refresh(ctx context.Context) error {
	return c.requestTokens(ctx, "/api/v1/auth/refresh", refreshRequest{
		RefreshToken: c.refreshToken,
	})
}

func (c *Client) requestTokens(ctx context.Context, path string, body any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("encode auth request: %w", err)
	}

	statusCode, responseBody, err := c.sendJSON(ctx, http.MethodPost, path, payload, false)
	if err != nil {
		return err
	}
	if statusCode < 200 || statusCode >= 300 {
		apiErr := &apiError{statusCode: statusCode, rawBody: strings.TrimSpace(string(responseBody))}
		_ = json.Unmarshal(responseBody, &apiErr.body)
		return apiErr
	}

	var tokens tokenResponse
	if err := json.Unmarshal(responseBody, &tokens); err != nil {
		return fmt.Errorf("decode auth response: %w", err)
	}
	c.cacheTokens(tokens)
	return nil
}

func (c *Client) cacheTokens(tokens tokenResponse) {
	tokenType := tokens.TokenType
	if tokenType == "" {
		tokenType = "Bearer"
	}
	c.accessToken = tokens.AccessToken
	c.refreshToken = tokens.RefreshToken
	c.tokenType = tokenType
	c.expiresAt = time.Now().Add(time.Duration(tokens.ExpiresIn)*time.Second - 30*time.Second)
}

func (c *Client) sendJSON(ctx context.Context, method, path string, payload []byte, protected bool) (int, []byte, error) {
	requestCtx, cancel := context.WithTimeout(ctx, requestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(requestCtx, method, c.resolve(path), bytes.NewReader(payload))
	if err != nil {
		return 0, nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	if protected {
		req.Header.Set("Authorization", c.tokenType+" "+c.accessToken)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, 1_048_576))
	if err != nil {
		return 0, nil, fmt.Errorf("read response: %w", err)
	}

	return resp.StatusCode, responseBody, nil
}

func decodeAPIResponse(statusCode int, responseBody []byte, out any) error {
	if statusCode < 200 || statusCode >= 300 {
		apiErr := &apiError{statusCode: statusCode, rawBody: strings.TrimSpace(string(responseBody))}
		_ = json.Unmarshal(responseBody, &apiErr.body)
		return apiErr
	}
	if len(responseBody) == 0 {
		return nil
	}
	if err := json.Unmarshal(responseBody, out); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}

func (c *Client) resolve(path string) string {
	resolved := *c.baseURL
	resolved.Path = strings.TrimRight(c.baseURL.Path, "/") + path
	return resolved.String()
}
