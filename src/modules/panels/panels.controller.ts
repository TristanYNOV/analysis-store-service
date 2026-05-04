import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentIdentity } from '../security/identity/current-identity.decorator';
import { IdentityContextGuard } from '../security/identity/identity-context.guard';
import { IdentityContext } from '../security/identity/identity-context.types';
import { CreatePanelDto, PanelResourceResponseDto, PatchPanelDto } from './panels.dto';
import { PanelsService } from './panels.service';
import {
  analysisPanelsCreatedTotal,
  analysisPanelsDeletedTotal,
  analysisPanelsExportedTotal,
  analysisPanelsUpdatedTotal,
} from '../../observability/metrics';

@Controller('panels')
@UseGuards(IdentityContextGuard)
export class PanelsController {
  constructor(private readonly panelsService: PanelsService) {}

  @Post()
  async createPanel(
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: CreatePanelDto,
  ): Promise<PanelResourceResponseDto> {
    try {
      const panel = await this.panelsService.create(identity, body);
      analysisPanelsCreatedTotal.labels('panel', 'create', 'success').inc();
      return panel;
    } catch (error) {
      analysisPanelsCreatedTotal.labels('panel', 'create', 'failure').inc();
      throw error;
    }
  }

  @Get()
  listPanels(@CurrentIdentity() identity: IdentityContext): Promise<PanelResourceResponseDto[]> {
    return this.panelsService.list(identity);
  }

  @Get(':id/export')
  async exportPanelById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
  ): Promise<Record<string, unknown>> {
    try {
      const panel = await this.panelsService.exportById(id, identity);
      analysisPanelsExportedTotal.labels('panel', 'export', 'success').inc();
      return panel;
    } catch (error) {
      analysisPanelsExportedTotal.labels('panel', 'export', 'failure').inc();
      throw error;
    }
  }

  @Get(':id')
  getPanelById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
  ): Promise<PanelResourceResponseDto> {
    return this.panelsService.getById(id, identity);
  }

  @Patch(':id')
  async patchPanelById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: PatchPanelDto,
  ): Promise<PanelResourceResponseDto> {
    try {
      const panel = await this.panelsService.patchById(id, identity, body);
      analysisPanelsUpdatedTotal.labels('panel', 'update', 'success').inc();
      return panel;
    } catch (error) {
      analysisPanelsUpdatedTotal.labels('panel', 'update', 'failure').inc();
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePanelById(@Param('id') id: string, @CurrentIdentity() identity: IdentityContext): Promise<void> {
    try {
      await this.panelsService.deleteById(id, identity);
      analysisPanelsDeletedTotal.labels('panel', 'delete', 'success').inc();
    } catch (error) {
      analysisPanelsDeletedTotal.labels('panel', 'delete', 'failure').inc();
      throw error;
    }
  }

  @Post(':id/copy')
  copyPanelById(@Param('id') id: string, @CurrentIdentity() identity: IdentityContext): Promise<PanelResourceResponseDto> {
    return this.panelsService.copyById(id, identity);
  }
}
