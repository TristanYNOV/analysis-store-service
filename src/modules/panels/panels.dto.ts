import {
  IsBoolean,
  IsEmpty,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { RESOURCE_VISIBILITY, ResourceVisibility } from '../security/access/resource-visibility';

export class PatchPanelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @ValidateIf((dto: PatchPanelDto) => dto.description !== null && dto.description !== undefined)
  @IsString()
  description?: string | null;

  @IsObject()
  contentJson!: Record<string, unknown>;

  @IsOptional()
  @IsIn(Object.values(RESOURCE_VISIBILITY))
  visibility?: ResourceVisibility;

  @IsOptional()
  @ValidateIf((dto: PatchPanelDto) => dto.clubId !== null && dto.clubId !== undefined)
  @IsString()
  @IsNotEmpty()
  clubId?: string | null;

  @IsOptional()
  @IsBoolean()
  hasAnonymizedContent?: boolean;

  @IsOptional()
  @ValidateIf((dto: PatchPanelDto) => dto.id !== undefined)
  @IsEmpty({ message: 'id is immutable' })
  id?: string;

  @IsOptional()
  @ValidateIf((dto: PatchPanelDto) => dto.ownerUserId !== undefined)
  @IsEmpty({ message: 'ownerUserId is immutable' })
  ownerUserId?: string;

  @IsOptional()
  @ValidateIf((dto: PatchPanelDto) => dto.owner_user_id !== undefined)
  @IsEmpty({ message: 'owner_user_id is immutable' })
  owner_user_id?: string;

  @IsOptional()
  @ValidateIf((dto: PatchPanelDto) => dto.createdAt !== undefined)
  @IsEmpty({ message: 'createdAt is immutable' })
  createdAt?: string;

  @IsOptional()
  @ValidateIf((dto: PatchPanelDto) => dto.created_at !== undefined)
  @IsEmpty({ message: 'created_at is immutable' })
  created_at?: string;
}

export class CreatePanelDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @ValidateIf((dto: CreatePanelDto) => dto.description !== null && dto.description !== undefined)
  @IsString()
  description?: string | null;

  @IsObject()
  contentJson!: Record<string, unknown>;

  @IsOptional()
  @IsIn(Object.values(RESOURCE_VISIBILITY))
  visibility?: ResourceVisibility;

  @IsOptional()
  @ValidateIf((dto: CreatePanelDto) => dto.clubId !== null && dto.clubId !== undefined)
  @IsString()
  @IsNotEmpty()
  clubId?: string | null;

  @IsOptional()
  @IsBoolean()
  hasAnonymizedContent?: boolean;

  @IsOptional()
  @ValidateIf((dto: CreatePanelDto) => dto.id !== undefined)
  @IsEmpty({ message: 'id is immutable' })
  id?: string;

  @IsOptional()
  @ValidateIf((dto: CreatePanelDto) => dto.ownerUserId !== undefined)
  @IsEmpty({ message: 'ownerUserId is immutable' })
  ownerUserId?: string;

  @IsOptional()
  @ValidateIf((dto: CreatePanelDto) => dto.owner_user_id !== undefined)
  @IsEmpty({ message: 'owner_user_id is immutable' })
  owner_user_id?: string;

  @IsOptional()
  @ValidateIf((dto: CreatePanelDto) => dto.createdAt !== undefined)
  @IsEmpty({ message: 'createdAt is immutable' })
  createdAt?: string;

  @IsOptional()
  @ValidateIf((dto: CreatePanelDto) => dto.created_at !== undefined)
  @IsEmpty({ message: 'created_at is immutable' })
  created_at?: string;
}

export interface PanelResourceResponseDto {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  visibility: ResourceVisibility;
  clubId: string | null;
  contentJson: Record<string, unknown>;
  hasAnonymizedContent: boolean;
  createdAt: string;
  updatedAt: string;
}
