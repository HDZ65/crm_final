import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import Stripe from 'stripe';

/**
 * Stripe error codes mapped to user-friendly messages
 */
const STRIPE_ERROR_MESSAGES: Record<string, { message: string; statusCode: number }> = {
  // Card errors
  card_declined: {
    message: 'Your card was declined. Please try a different payment method.',
    statusCode: HttpStatus.PAYMENT_REQUIRED,
  },
  expired_card: {
    message: 'Your card has expired. Please use a different card.',
    statusCode: HttpStatus.PAYMENT_REQUIRED,
  },
  incorrect_cvc: {
    message: 'The security code (CVC) is incorrect. Please check and try again.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  incorrect_number: {
    message: 'The card number is incorrect. Please check and try again.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  insufficient_funds: {
    message: 'Your card has insufficient funds. Please try a different payment method.',
    statusCode: HttpStatus.PAYMENT_REQUIRED,
  },
  invalid_cvc: {
    message: 'The security code (CVC) is invalid. Please check and try again.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  invalid_expiry_month: {
    message: 'The expiration month is invalid. Please check and try again.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  invalid_expiry_year: {
    message: 'The expiration year is invalid. Please check and try again.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  invalid_number: {
    message: 'The card number is invalid. Please check and try again.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  processing_error: {
    message: 'An error occurred while processing your card. Please try again.',
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  },
  // Authentication errors
  authentication_required: {
    message: 'This transaction requires authentication. Please complete the verification.',
    statusCode: HttpStatus.PAYMENT_REQUIRED,
  },
  // Rate limit errors
  rate_limit: {
    message: 'Too many requests. Please wait a moment and try again.',
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
  },
  // API errors
  api_connection_error: {
    message: 'Unable to connect to payment service. Please try again.',
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  },
  api_error: {
    message: 'Payment service error. Please try again later.',
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  },
  // Invalid request errors
  invalid_request_error: {
    message: 'Invalid payment request. Please check your information.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  // Resource errors
  resource_missing: {
    message: 'The requested resource was not found.',
    statusCode: HttpStatus.NOT_FOUND,
  },
  // Customer errors
  email_invalid: {
    message: 'The email address provided is invalid.',
    statusCode: HttpStatus.BAD_REQUEST,
  },
  // Subscription errors
  subscription_payment_intent_requires_action: {
    message: 'Your subscription requires payment confirmation.',
    statusCode: HttpStatus.PAYMENT_REQUIRED,
  },
};

/**
 * Exception filter for Stripe errors
 * Catches Stripe-specific errors and returns user-friendly messages
 */
@Catch(Stripe.errors.StripeError)
export class StripeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(StripeExceptionFilter.name);

  catch(exception: Stripe.errors.StripeError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorCode = exception.code || exception.type;
    const declineCode = (exception as any).decline_code;

    // Log the full error for debugging
    this.logger.error(`Stripe error: ${exception.type}`, {
      code: errorCode,
      declineCode,
      message: exception.message,
      requestId: exception.requestId,
    });

    // Get mapped error or use default
    const mappedError = STRIPE_ERROR_MESSAGES[declineCode] ||
      STRIPE_ERROR_MESSAGES[errorCode || ''] ||
      this.getDefaultError(exception);

    response.status(mappedError.statusCode).json({
      statusCode: mappedError.statusCode,
      error: 'StripeError',
      message: mappedError.message,
      code: errorCode,
      declineCode: declineCode || undefined,
      requestId: exception.requestId,
    });
  }

  private getDefaultError(exception: Stripe.errors.StripeError): {
    message: string;
    statusCode: number;
  } {
    switch (exception.type) {
      case 'StripeCardError':
        return {
          message: 'Your card could not be charged. Please try a different payment method.',
          statusCode: HttpStatus.PAYMENT_REQUIRED,
        };
      case 'StripeRateLimitError':
        return {
          message: 'Too many requests. Please wait and try again.',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
        };
      case 'StripeInvalidRequestError':
        return {
          message: 'Invalid payment request. Please check your information.',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      case 'StripeAPIError':
        return {
          message: 'Payment service temporarily unavailable. Please try again.',
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        };
      case 'StripeConnectionError':
        return {
          message: 'Unable to connect to payment service. Please try again.',
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        };
      case 'StripeAuthenticationError':
        return {
          message: 'Payment authentication failed.',
          statusCode: HttpStatus.UNAUTHORIZED,
        };
      case 'StripePermissionError':
        return {
          message: 'Payment permission denied.',
          statusCode: HttpStatus.FORBIDDEN,
        };
      case 'StripeIdempotencyError':
        return {
          message: 'Duplicate request detected. Please refresh and try again.',
          statusCode: HttpStatus.CONFLICT,
        };
      case 'StripeSignatureVerificationError':
        return {
          message: 'Invalid webhook signature.',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      default:
        return {
          message: 'An unexpected payment error occurred. Please try again.',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
    }
  }
}

/**
 * Utility function to check if an error is a Stripe error
 */
export function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return error instanceof Stripe.errors.StripeError;
}

/**
 * Get user-friendly message for a Stripe error code
 */
export function getStripeErrorMessage(code: string): string {
  return STRIPE_ERROR_MESSAGES[code]?.message || 'An unexpected payment error occurred.';
}
