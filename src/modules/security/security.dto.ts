import { IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { RESOURCE_VISIBILITY, ResourceVisibility } from './access/resource-visibility';

export class CheckTimelineAccessDto {
  @IsString()
  @IsNotEmpty()
  ownerId!: string;
}

export class CheckPanelAccessDto {
  @IsString()
  @IsNotEmpty()
  ownerId!: string;

  @IsIn(Object.values(RESOURCE_VISIBILITY))
  visibility!: ResourceVisibility;

  @ValidateIf((dto: CheckPanelAccessDto) => dto.visibility === RESOURCE_VISIBILITY.club)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  clubId?: string;
}
