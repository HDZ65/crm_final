import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type JwtUser = Record<string, unknown>;
type RequestWithUser = { user?: JwtUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
