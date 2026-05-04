import { Controller, Delete, Param, Patch, UseGuards, Body, HttpCode, Post, Get } from '@nestjs/common';
import { IdentityContextGuard } from '../security/identity/identity-context.guard';
import { CurrentIdentity } from '../security/identity/current-identity.decorator';
import { IdentityContext } from '../security/identity/identity-context.types';
import { TimelinesService } from './timelines.service';
import { CreateTimelineDto, PatchTimelineDto, TimelineResourceResponseDto } from './timelines.dto';
import {
  analysisTimelinesCreatedTotal,
  analysisTimelinesDeletedTotal,
  analysisTimelinesExportedTotal,
  analysisTimelinesUpdatedTotal,
} from '../../observability/metrics';

@Controller('timelines')
@UseGuards(IdentityContextGuard)
export class TimelinesController {
  constructor(private readonly timelinesService: TimelinesService) {}

  @Post()
  async createTimeline(
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: CreateTimelineDto,
  ): Promise<TimelineResourceResponseDto> {
    try {
      const timeline = await this.timelinesService.create(identity, body);
      analysisTimelinesCreatedTotal.labels('timeline', 'create', 'success').inc();
      return timeline;
    } catch (error) {
      analysisTimelinesCreatedTotal.labels('timeline', 'create', 'failure').inc();
      throw error;
    }
  }

  @Get()
  listTimelines(@CurrentIdentity() identity: IdentityContext): Promise<TimelineResourceResponseDto[]> {
    return this.timelinesService.list(identity);
  }

  @Get(':id/export')
  async exportTimelineById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
  ): Promise<Record<string, unknown>> {
    try {
      const timeline = await this.timelinesService.exportById(id, identity);
      analysisTimelinesExportedTotal.labels('timeline', 'export', 'success').inc();
      return timeline;
    } catch (error) {
      analysisTimelinesExportedTotal.labels('timeline', 'export', 'failure').inc();
      throw error;
    }
  }

  @Get(':id')
  getTimelineById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
  ): Promise<TimelineResourceResponseDto> {
    return this.timelinesService.getById(id, identity);
  }

  @Patch(':id')
  async patchTimelineById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: PatchTimelineDto,
  ): Promise<TimelineResourceResponseDto> {
    try {
      const timeline = await this.timelinesService.patchById(id, identity, body);
      analysisTimelinesUpdatedTotal.labels('timeline', 'update', 'success').inc();
      return timeline;
    } catch (error) {
      analysisTimelinesUpdatedTotal.labels('timeline', 'update', 'failure').inc();
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteTimelineById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
  ): Promise<void> {
    try {
      await this.timelinesService.deleteById(id, identity);
      analysisTimelinesDeletedTotal.labels('timeline', 'delete', 'success').inc();
    } catch (error) {
      analysisTimelinesDeletedTotal.labels('timeline', 'delete', 'failure').inc();
      throw error;
    }
  }
}
