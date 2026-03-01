import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

function serialize(value: any): any {
  if (typeof value === "bigint") return value.toString();

  // ✅ ВАЖНО: Date нельзя превращать в {}
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) return value.map(serialize);

  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serialize(v);
    }
    return out;
  }

  return value;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => serialize(data)));
  }
}