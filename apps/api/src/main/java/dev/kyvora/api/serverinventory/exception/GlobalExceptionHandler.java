package dev.kyvora.api.serverinventory.exception;

import java.time.Instant;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import dev.kyvora.api.agent.exception.AgentEnrollmentCancellationException;
import dev.kyvora.api.agent.exception.AgentNotFoundException;
import dev.kyvora.api.agent.exception.AgentTokenAuthenticationException;
import dev.kyvora.api.agent.exception.AgentTokenForbiddenException;
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

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ServerInventoryNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleNotFound(
			ServerInventoryNotFoundException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(AgentNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleAgentNotFound(
			AgentNotFoundException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(ManagedServiceNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleManagedServiceNotFound(
			ManagedServiceNotFoundException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(NotificationNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleNotificationNotFound(
			NotificationNotFoundException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(UserNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleUserNotFound(
			UserNotFoundException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(
			MethodArgumentNotValidException exception,
			HttpServletRequest request) {
		List<String> details = exception.getBindingResult().getFieldErrors().stream()
				.map(GlobalExceptionHandler::formatFieldError)
				.toList();
		return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request.getRequestURI(), details);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
			ConstraintViolationException exception,
			HttpServletRequest request) {
		List<String> details = exception.getConstraintViolations().stream()
				.map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
				.toList();
		return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request.getRequestURI(), details);
	}

	@ExceptionHandler(SettingsValidationException.class)
	public ResponseEntity<ApiErrorResponse> handleSettingsValidation(
			SettingsValidationException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request.getRequestURI(), exception.getDetails());
	}

	@ExceptionHandler(UserManagementException.class)
	public ResponseEntity<ApiErrorResponse> handleUserManagement(
			UserManagementException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
			DataIntegrityViolationException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, "Request conflicts with existing data", request.getRequestURI(), List.of(detectConflictDetail(exception)));
	}

	@ExceptionHandler({InvalidCredentialsException.class, InvalidTokenException.class})
	public ResponseEntity<ApiErrorResponse> handleAuthenticationFailure(
			RuntimeException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.UNAUTHORIZED, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(AgentTokenAuthenticationException.class)
	public ResponseEntity<ApiErrorResponse> handleAgentTokenAuthenticationFailure(
			AgentTokenAuthenticationException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.UNAUTHORIZED, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(AgentTokenForbiddenException.class)
	public ResponseEntity<ApiErrorResponse> handleAgentTokenForbidden(
			AgentTokenForbiddenException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.FORBIDDEN, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(DuplicateServerInventoryException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicate(
			DuplicateServerInventoryException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of(exception.getField() + ": " + exception.getValue()));
	}

	@ExceptionHandler(DuplicateAgentException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicateAgent(
			DuplicateAgentException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of(exception.getField() + ": " + exception.getValue()));
	}

	@ExceptionHandler(AgentEnrollmentCancellationException.class)
	public ResponseEntity<ApiErrorResponse> handleAgentEnrollmentCancellation(
			AgentEnrollmentCancellationException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of());
	}

	@ExceptionHandler(NotificationNotDismissibleException.class)
	public ResponseEntity<ApiErrorResponse> handleNotificationNotDismissible(
			NotificationNotDismissibleException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), List.of());
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
