import { z } from "zod";

const TransformSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("wrap-section"), title: z.string() }),
	z.object({ kind: z.literal("wrap-tool-tag"), name: z.string() }),
	z.object({ kind: z.literal("strip-frontmatter") }),
]);

const ExtraSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("plugin-manifest"), source: z.string() }),
	z.object({ kind: z.literal("slash-commands"), source: z.string() }),
	z.object({
		kind: z.literal("mcp-snippet"),
		format: z.enum(["json", "jsonc", "yaml"]),
	}),
	z.object({ kind: z.literal("readme-snippet") }),
]);

export const RecipeSchema = z.object({
	outputPath: z.string().min(1),
	blocks: z.array(z.string()),
	frontmatter: z.record(z.string(), z.unknown()).optional(),
	transforms: z.array(TransformSchema).optional(),
	extras: z.array(ExtraSchema).optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type Transform = z.infer<typeof TransformSchema>;
export type Extra = z.infer<typeof ExtraSchema>;
