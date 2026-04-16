import type {
    RoomTemplate,
    RoomTemplateRegistry,
    TileMatrixValidationResult,
} from "./types";
import { ROOM_TEMPLATE_VERSION } from "./types";
import { validateRoomTemplate } from "./parser";

export type RoomTemplateRegistryService = {
    register: (template: RoomTemplate) => TileMatrixValidationResult;
    get: (id: string) => RoomTemplate | undefined;
    list: () => RoomTemplate[];
    remove: (id: string) => boolean;
    has: (id: string) => boolean;
    clear: () => void;
    exportAll: (options?: { pretty?: boolean }) => string;
    importAll: (raw: string) => TileMatrixValidationResult;
};

export function createRoomTemplateRegistry(): RoomTemplateRegistryService {
    const templates = new Map<string, RoomTemplate>();

    const register = (template: RoomTemplate): TileMatrixValidationResult => {
        const validation = validateRoomTemplate(template);
        if (!validation.ok) return validation;

        if (templates.has(template.id)) {
            return {
                ok: false,
                errors: [`Template with id "${template.id}" already registered.`],
                warnings: [],
            };
        }

        templates.set(template.id, template);
        return validation;
    };

    const get = (id: string): RoomTemplate | undefined => templates.get(id);

    const list = (): RoomTemplate[] => Array.from(templates.values());

    const remove = (id: string): boolean => templates.delete(id);

    const has = (id: string): boolean => templates.has(id);

    const clear = (): void => {
        templates.clear();
    };

    const exportAll = (options?: { pretty?: boolean }): string => {
        const registry: RoomTemplateRegistry = {
            version: ROOM_TEMPLATE_VERSION,
            templates: list(),
        };
        return JSON.stringify(registry, null, options?.pretty ? 2 : undefined);
    };

    const importAll = (raw: string): TileMatrixValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return {
                ok: false,
                errors: ["Invalid JSON."],
                warnings: [],
            };
        }

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !("version" in parsed) ||
            !("templates" in parsed)
        ) {
            return {
                ok: false,
                errors: ['Missing required fields "version" and "templates".'],
                warnings: [],
            };
        }

        const registry = parsed as RoomTemplateRegistry;
        if (registry.version !== ROOM_TEMPLATE_VERSION) {
            errors.push(
                `Expected version "${ROOM_TEMPLATE_VERSION}", got "${registry.version}".`,
            );
        }

        if (!Array.isArray(registry.templates)) {
            return {
                ok: false,
                errors: ['"templates" must be an array.'],
                warnings: [],
            };
        }

        templates.clear();

        for (let i = 0; i < registry.templates.length; i++) {
            const t = registry.templates[i];
            const result = register(t);
            if (!result.ok) {
                errors.push(
                    ...result.errors.map((e) => `Template [${i}] "${t?.id ?? "?"}": ${e}`),
                );
            }
            warnings.push(...result.warnings);
        }

        return { ok: errors.length === 0, errors, warnings };
    };

    return { register, get, list, remove, has, clear, exportAll, importAll };
}
