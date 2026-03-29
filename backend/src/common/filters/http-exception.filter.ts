import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : Array.isArray((body as { message?: unknown }).message)
            ? (body as { message: string[] }).message.join(', ')
            : ((body as { message?: string }).message ?? exception.message);

      response.status(status).json({
        statusCode: status,
        message,
        error:
          typeof body === 'string'
            ? exception.name
            : ((body as { error?: string }).error ?? exception.name),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
