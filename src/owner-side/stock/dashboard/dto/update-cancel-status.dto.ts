import { IsEnum } from 'class-validator';
import { CancelStatus } from 'src/employee-side/order/dto/create-order/create-order.dto';

export class UpdateCancelStatusDto {
  @IsEnum(CancelStatus, {
    message: `cancel_status must be one of the following: ${Object.values(CancelStatus).join(', ')}`,
  })
  cancel_status: CancelStatus;
}
