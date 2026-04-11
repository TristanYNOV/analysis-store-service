import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentIdentity } from '../security/identity/current-identity.decorator';
import { IdentityContextGuard } from '../security/identity/identity-context.guard';
import { IdentityContext } from '../security/identity/identity-context.types';
import { CreatePanelDto, PanelResourceResponseDto, PatchPanelDto } from './panels.dto';
import { PanelsService } from './panels.service';

@Controller('panels')
@UseGuards(IdentityContextGuard)
export class PanelsController {
  constructor(private readonly panelsService: PanelsService) {}

  @Post()
  createPanel(
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: CreatePanelDto,
  ): Promise<PanelResourceResponseDto> {
    return this.panelsService.create(identity, body);
  }

  @Get()
  listPanels(@CurrentIdentity() identity: IdentityContext): Promise<PanelResourceResponseDto[]> {
    return this.panelsService.list(identity);
  }

  @Get(':id')
  getPanelById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
  ): Promise<PanelResourceResponseDto> {
    return this.panelsService.getById(id, identity);
  }

  @Patch(':id')
  patchPanelById(
    @Param('id') id: string,
    @CurrentIdentity() identity: IdentityContext,
    @Body() body: PatchPanelDto,
  ): Promise<PanelResourceResponseDto> {
    return this.panelsService.patchById(id, identity, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePanelById(@Param('id') id: string, @CurrentIdentity() identity: IdentityContext): Promise<void> {
    await this.panelsService.deleteById(id, identity);
  }

  @Post(':id/copy')
  copyPanelById(@Param('id') id: string, @CurrentIdentity() identity: IdentityContext): Promise<PanelResourceResponseDto> {
    return this.panelsService.copyById(id, identity);
  }
}
