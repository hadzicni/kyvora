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
	baseURL    *url.URL
	username   string
	password   string
	httpClient *http.Client
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
		baseURL:    baseURL,
		username:   cfg.APIUsername,
		password:   cfg.APIPassword,
		httpClient: &http.Client{},
	}, nil
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
	requestCtx, cancel := context.WithTimeout(ctx, requestTimeout)
	defer cancel()

	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("encode request: %w", err)
	}

	req, err := http.NewRequestWithContext(requestCtx, method, c.resolve(path), bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(c.username, c.password)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, 1_048_576))
	if err != nil {
		return fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		apiErr := &apiError{statusCode: resp.StatusCode, rawBody: strings.TrimSpace(string(responseBody))}
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
