export const orderCategoriesWithClimbingAtEnd = (categories: string[]): string[] => {
    const normalized = Array.from(new Set(categories));
    const climbCategories = normalized
        .filter((cat) => cat.toLowerCase().includes("climbing"))
        .sort((a, b) => a.localeCompare(b));
    const otherCategories = normalized
        .filter((cat) => !cat.toLowerCase().includes("climbing"))
        .sort((a, b) => a.localeCompare(b));
    return [...otherCategories, ...climbCategories];
};
