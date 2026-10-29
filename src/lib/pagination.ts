export type PaginationMeta = {
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
};

export const getPaginationMeta = (
	totalCount: number,
	page: number,
	pageSize: number,
	minTotalPages: number = 0
): PaginationMeta => {
	const totalPages = Math.max(Math.ceil(totalCount / pageSize), minTotalPages);

	return {
		totalPages,
		currentPage: page,
		hasPreviousPage: page > 1,
		hasNextPage: page < totalPages
	};
};
