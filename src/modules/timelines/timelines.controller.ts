import { Controller, Delete, Param, Patch, UseGuards, Body, HttpCode } from '@nestjs/common';
import { IdentityContextGuard } from '../security/identity/identity-context.guard';
import { CurrentIdentity } from '../security/identity/current-identity.decorator';
import { IdentityContext } from '../security/identity/identity-context.types';
import { TimelinesService } from './timelines.service';
import { PatchTimelineDto, TimelineResourceResponseDto } from './timelines.dto';

@Controller('timelines')
@UseGuards(IdentityContextGuard)
export class TimelinesController {
  constructor(private readonly timelinesService: TimelinesService) {}

  @Patch(':id')
  patchTimelineById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: PatchTimelineDto,
  ): Promise<TimelineResourceResponseDto> {
    return this.timelinesService.patchById(id, identity, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteTimelineById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
  ): Promise<void> {
    await this.timelinesService.deleteById(id, identity);
  }
}
