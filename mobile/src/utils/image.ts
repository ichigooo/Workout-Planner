import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export interface ConvertImageOptions {
    maxWidth?: number; // default 1024
    compress?: number; // 0..1, default 0.8
    format?: "jpeg" | "png" | "webp"; // default "jpeg"
}

export interface ImageAssetLike {
    uri: string;
    mimeType?: string | null;
    base64?: string | null;
}

export interface ConvertedImageResult {
    dataUrl: string; // data:<content-type>;base64,<data>
    displayUri: string; // uri to use for Image component
    contentType: string; // resolved content type
}

function resolveFormatContentType(format: "jpeg" | "png" | "webp"): string {
    switch (format) {
        case "png":
            return "image/png";
        case "webp":
            return "image/webp";
        case "jpeg":
        default:
            return "image/jpeg";
    }
}

/**
 * Convert an Expo ImagePicker asset to a base64 data URL with optional resize/compress.
 * Falls back to using the original asset base64 if manipulation fails.
 * Throws if neither manipulated nor original base64 is available.
 */
export async function imageAssetToDataUrl(
    asset: ImageAssetLike,
    options: ConvertImageOptions = {},
): Promise<ConvertedImageResult> {
    const maxWidth = options.maxWidth ?? 1024;
    const compress = options.compress ?? 0.8;
    const format = options.format ?? "jpeg";
    const contentType = resolveFormatContentType(format);

    // First, try to resize/compress and get base64 via manipulator
    try {
        const manipulated = await manipulateAsync(
            asset.uri,
            [{ resize: { width: maxWidth } }],
            { compress, format: SaveFormat[format.toUpperCase() as keyof typeof SaveFormat], base64: true },
        );
        if (manipulated?.base64) {
            return {
                dataUrl: `data:${contentType};base64,${manipulated.base64}`,
                displayUri: manipulated.uri || asset.uri,
                contentType,
            };
        }
    } catch {
        // fall through to fallback
    }

    // Fallback to original asset.base64 if present
    if (asset.base64) {
        const fallbackCt = asset.mimeType || contentType;
        return {
            dataUrl: `data:${fallbackCt};base64,${asset.base64}`,
            displayUri: asset.uri,
            contentType: String(fallbackCt),
        };
    }

    throw new Error("IMAGE_BASE64_UNAVAILABLE");
}


