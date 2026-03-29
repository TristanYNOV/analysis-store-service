import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentIdentity } from './identity/current-identity.decorator';
import { IdentityContextGuard } from './identity/identity-context.guard';
import { IdentityContext } from './identity/identity-context.types';
import { AccessControlService } from './access/access-control.service';
import { CheckPanelAccessDto, CheckTimelineAccessDto } from './security.dto';

@Controller('security')
@UseGuards(IdentityContextGuard)
export class SecurityController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('context')
  getContext(@CurrentIdentity() identity: IdentityContext) {
    return identity;
  }

  @Post('access-check/timeline')
  checkTimelineAccess(
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: CheckTimelineAccessDto,
  ): { allowed: boolean } {
    return {
      allowed: this.accessControlService.canAccessTimeline(identity, body),
    };
  }

  @Post('access-check/panel')
  checkPanelAccess(
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: CheckPanelAccessDto,
  ): { allowed: boolean } {
    return {
      allowed: this.accessControlService.canAccessPanel(identity, body),
    };
  }
}
