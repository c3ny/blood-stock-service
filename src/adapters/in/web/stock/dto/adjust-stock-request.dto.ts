import { IsInt, IsNotEmpty, IsString, MaxLength, NotEquals } from 'class-validator';

export class AdjustStockRequestDTO {
  @IsInt({ message: 'Movement must be an integer' })
  @NotEquals(0, { message: 'Movement cannot be zero' })
  movement: number = 0;

  @IsString({ message: 'ActionBy must be a string' })
  @IsNotEmpty({ message: 'ActionBy is required' })
  @MaxLength(255, { message: 'ActionBy must not exceed 255 characters' })
  actionBy: string = '';

  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes must not exceed 1000 characters' })
  notes: string = '';
}
