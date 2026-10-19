import { createParamDecorator } from '@nestjs/common';
export const CurrentSession = createParamDecorator((_data, context) => {
    const req = context.switchToHttp().getRequest();
    return (req.authSession ||
        req.currentSession || { user: req.user, session: req.session });
});
//# sourceMappingURL=current-session.decorator.js.map