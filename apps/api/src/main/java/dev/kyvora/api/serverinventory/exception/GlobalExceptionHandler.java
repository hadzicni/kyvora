package dev.kyvora.api.serverinventory.exception;

import java.time.Instant;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import dev.kyvora.api.agent.exception.AgentNotFoundException;
import dev.kyvora.api.agent.exception.DuplicateAgentException;
import dev.kyvora.api.auth.service.InvalidCredentialsException;
import dev.kyvora.api.auth.service.InvalidTokenException;
import dev.kyvora.api.auth.exception.UserManagementException;
import dev.kyvora.api.auth.exception.UserNotFoundException;
import dev.kyvora.api.managedservice.exception.ManagedServiceNotFoundException;
import dev.kyvora.api.notification.exception.NotificationNotDismissibleException;
import dev.kyvora.api.notification.exception.NotificationNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import dev.kyvora.api.settings.exception.SettingsValidationException;
import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(ServerInventoryNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleNotFound(
			ServerInventoryNotFoundException exception,
			HttpServletRequest request) {
		log.debug("Server inventory item not found for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(AgentNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleAgentNotFound(
			AgentNotFoundException exception,
			HttpServletRequest request) {
		log.debug("Agent not found for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(ManagedServiceNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleManagedServiceNotFound(
			ManagedServiceNotFoundException exception,
			HttpServletRequest request) {
		log.debug("Managed service not found for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(NotificationNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleNotificationNotFound(
			NotificationNotFoundException exception,
			HttpServletRequest request) {
		log.debug("Notification not found for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(UserNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleUserNotFound(
			UserNotFoundException exception,
			HttpServletRequest request) {
		log.debug("User not found for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(
			MethodArgumentNotValidException exception,
			HttpServletRequest request) {
		List<String> details = exception.getBindingResult().getFieldErrors().stream()
				.map(GlobalExceptionHandler::formatFieldError)
				.toList();
		log.warn("Request validation failed for path {} with {} field errors", request.getRequestURI(), details.size());
		return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request.getRequestURI(), details);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiErrorResponse> handleUnreadableMessage(
			HttpMessageNotReadableException exception,
			HttpServletRequest request) {
		log.warn("Request body could not be read for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.BAD_REQUEST, "Request body is invalid or missing", request.getRequestURI(), List.of());
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
			ConstraintViolationException exception,
			HttpServletRequest request) {
		List<String> details = exception.getConstraintViolations().stream()
				.map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
				.toList();
		log.warn("Request constraint validation failed for path {} with {} violations", request.getRequestURI(), details.size());
		return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request.getRequestURI(), details);
	}

	@ExceptionHandler(SettingsValidationException.class)
	public ResponseEntity<ApiErrorResponse> handleSettingsValidation(
			SettingsValidationException exception,
			HttpServletRequest request) {
		log.warn("Settings validation failed for path {} with {} errors", request.getRequestURI(), exception.getDetails().size());
		return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request.getRequestURI(), exception.getDetails());
	}

	@ExceptionHandler(UserManagementException.class)
	public ResponseEntity<ApiErrorResponse> handleUserManagement(
			UserManagementException exception,
			HttpServletRequest request) {
		log.warn("User management conflict for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
			DataIntegrityViolationException exception,
			HttpServletRequest request) {
		log.warn("Data integrity conflict for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.CONFLICT, "Request conflicts with existing data", request.getRequestURI(), List.of(detectConflictDetail(exception)));
	}

	@ExceptionHandler({InvalidCredentialsException.class, InvalidTokenException.class})
	public ResponseEntity<ApiErrorResponse> handleAuthenticationFailure(
			RuntimeException exception,
			HttpServletRequest request) {
		log.warn("Authentication failure for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.UNAUTHORIZED, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiErrorResponse> handleAccessDenied(
			AccessDeniedException exception,
			HttpServletRequest request) {
		log.warn("Access denied for path {}", request.getRequestURI());
		return buildResponse(
				HttpStatus.FORBIDDEN,
				"You do not have permission to perform this action.",
				request.getRequestURI(),
				List.of());
	}

	@ExceptionHandler(DuplicateServerInventoryException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicate(
			DuplicateServerInventoryException exception,
			HttpServletRequest request) {
		log.warn("Duplicate server inventory value rejected for field {}", exception.getField());
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of(exception.getField() + ": " + exception.getValue()));
	}

	@ExceptionHandler(DuplicateAgentException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicateAgent(
			DuplicateAgentException exception,
			HttpServletRequest request) {
		log.warn("Duplicate agent value rejected for field {}", exception.getField());
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of(exception.getField() + ": " + exception.getValue()));
	}

	@ExceptionHandler(NotificationNotDismissibleException.class)
	public ResponseEntity<ApiErrorResponse> handleNotificationNotDismissible(
			NotificationNotDismissibleException exception,
			HttpServletRequest request) {
		log.warn("Notification dismiss rejected for path {}", request.getRequestURI());
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleUnexpected(
			Exception exception,
			HttpServletRequest request) {
		log.error("Unexpected error while handling path {}", request.getRequestURI(), exception);
		return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error", request.getRequestURI(), List.of());
	}

	private static String formatFieldError(FieldError fieldError) {
		return fieldError.getField() + ": " + fieldError.getDefaultMessage();
	}

	private static String detectConflictDetail(DataIntegrityViolationException exception) {
		String message = exception.getMostSpecificCause() != null ? exception.getMostSpecificCause().getMessage() : exception.getMessage();
		return message == null ? "duplicate or conflicting data" : message;
	}

	private ResponseEntity<ApiErrorResponse> buildResponse(
			HttpStatus status,
			String message,
			String path,
			List<String> details) {
		return ResponseEntity.status(status).body(new ApiErrorResponse(
				Instant.now(),
				status.value(),
				status.getReasonPhrase(),
				message,
				path,
				details));
	}
}
