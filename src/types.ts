import { PaginationModel } from './value-objects'

type ChorusModels<ListModel, DetailsModel> = {
    list: ListModel,
    details: DetailsModel
}

type ChorusFilters<ListFilter, SpecificFilter> = {
    list: ListFilter,
    specific: SpecificFilter
}

type ChorusActionPayload<CreationPayload, UpdatePayload> = {
    creation: CreationPayload,
    update: UpdatePayload
}

export type ChorusSchemas<
    ListModel,
    DetailsModel,
    ListFilter,
    SpecificFilter,
    CreationPayload,
    UpdatePayload
> = {
    models: ChorusModels<ListModel, DetailsModel>,
    filters: ChorusFilters<ListFilter, SpecificFilter>,
    actionsPayload: ChorusActionPayload<CreationPayload, UpdatePayload>
}

export type ChorusRepository<T extends ChorusSchemas<unknown, unknown, unknown, unknown, unknown, unknown>> = {
    list: (filter: T['filters']['list'], pagination?: PaginationModel) => Promise<Array<T['models']['list']>>,
    details: (filter: T['filters']['specific']) => Promise<T['models']['details'] | null>,
    create: (filter: T['actionsPayload']['creation']) => Promise<T['models']['details']>,
    updateOne: (filter: T['filters']['specific'], payload: T['actionsPayload']['update']) => Promise<{ existed: boolean }>,
    deleteOne: (filter: T['filters']['specific']) => Promise<{ existed: boolean }>
}

export type SchemaFromRepository<T extends ChorusRepository<any>> = {
    filters: ChorusFilters<Parameters<T['list']>[0], Parameters<T['details']>[0]>,
    models: ChorusModels<Awaited<ReturnType<T['list']>>[number], NonNullable<Awaited<ReturnType<T['details']>>>>,
    actionsPayload: ChorusActionPayload<Parameters<T['create']>[0], Parameters<T['updateOne']>[1]>
}
