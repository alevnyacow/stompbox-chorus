import { ValueObject } from "@stompbox/compressor";
import z from "zod";

export class Pagination extends ValueObject(z.object({ 
    zeroBasedPageIndex: z.coerce.number().int().nonnegative(),
    pageSize: z.coerce.number().int().positive()
})) {

}

export type PaginationModel = Pagination['model']