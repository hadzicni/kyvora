package agent

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	requestTimeout   = 10 * time.Second
	agentTokenHeader = "X-Kyvora-Agent-Token"
)

type Client struct {
	baseURL    *url.URL
	agentToken string
	httpClient *http.Client
}

type Agent struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Hostname string `json:"hostname"`
	Version  string `json:"version"`
	Status   string `json:"status"`
}

type heartbeatRequest struct {
	Status    string     `json:"status"`
	Version   string     `json:"version"`
	Hostname  string     `json:"hostname,omitempty"`
	HostFacts *HostFacts `json:"hostFacts,omitempty"`
}

type StatusResponse struct {
	Service     string    `json:"service"`
	Version     string    `json:"version"`
	GeneratedAt time.Time `json:"generatedAt"`
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

type AgentTokenAuthError struct {
	StatusCode int
	Message    string
}

func (e *AgentTokenAuthError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "agent token is invalid or revoked"
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
		agentToken: cfg.AgentToken,
		httpClient: &http.Client{},
	}, nil
}

func (c *Client) Heartbeat(ctx context.Context, agentID, version, hostname string, hostFacts *HostFacts) (Agent, error) {
	var updated Agent
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/agents/"+url.PathEscape(agentID)+"/heartbeat", heartbeatRequest{
		Status:    "ONLINE",
		Version:   version,
		Hostname:  hostname,
		HostFacts: hostFacts,
	}, &updated)
	return updated, err
}

func (c *Client) Status(ctx context.Context) (StatusResponse, error) {
	var status StatusResponse
	statusCode, responseBody, err := c.send(ctx, http.MethodGet, "/api/v1/status", nil, false)
	if err != nil {
		return status, err
	}
	if err := decodeAPIResponse(statusCode, responseBody, &status); err != nil {
		return status, err
	}
	return status, nil
}

func (c *Client) doJSON(ctx context.Context, method, path string, body any, out any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("encode request: %w", err)
	}

	statusCode, responseBody, err := c.send(ctx, method, path, payload, true)
	if err != nil {
		return err
	}

	return decodeAPIResponse(statusCode, responseBody, out)
}

func (c *Client) send(ctx context.Context, method, path string, payload []byte, includeAgentToken bool) (int, []byte, error) {
	requestCtx, cancel := context.WithTimeout(ctx, requestTimeout)
	defer cancel()

	var body io.Reader
	if payload != nil {
		body = bytes.NewReader(payload)
	}
	req, err := http.NewRequestWithContext(requestCtx, method, c.resolve(path), body)
	if err != nil {
		return 0, nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if includeAgentToken {
		req.Header.Set(agentTokenHeader, c.agentToken)
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
		if statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden {
			return &AgentTokenAuthError{StatusCode: statusCode, Message: apiErr.Error()}
		}
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
