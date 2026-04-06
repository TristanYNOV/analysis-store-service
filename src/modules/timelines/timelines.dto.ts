import {
  IsBoolean,
  IsEmpty,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class PatchTimelineDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @ValidateIf((dto: PatchTimelineDto) => dto.description !== null && dto.description !== undefined)
  @IsString()
  description?: string | null;

  @IsObject()
  contentJson!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  hasAnonymizedContent?: boolean;

  @IsOptional()
  @ValidateIf((dto: PatchTimelineDto) => dto.id !== undefined)
  @IsEmpty({ message: 'id is immutable' })
  id?: string;

  @IsOptional()
  @ValidateIf((dto: PatchTimelineDto) => dto.ownerUserId !== undefined)
  @IsEmpty({ message: 'ownerUserId is immutable' })
  ownerUserId?: string;

  @IsOptional()
  @ValidateIf((dto: PatchTimelineDto) => dto.owner_user_id !== undefined)
  @IsEmpty({ message: 'owner_user_id is immutable' })
  owner_user_id?: string;

  @IsOptional()
  @ValidateIf((dto: PatchTimelineDto) => dto.createdAt !== undefined)
  @IsEmpty({ message: 'createdAt is immutable' })
  createdAt?: string;

  @IsOptional()
  @ValidateIf((dto: PatchTimelineDto) => dto.created_at !== undefined)
  @IsEmpty({ message: 'created_at is immutable' })
  created_at?: string;
}

export interface TimelineResourceResponseDto {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  visibility: 'private' | 'club' | 'public';
  clubId: string | null;
  contentJson: Record<string, unknown>;
  hasAnonymizedContent: boolean;
  createdAt: string;
  updatedAt: string;
}
