export interface IUpdateProfilePayload {
  name?: string;
  phone?: string;
  profileImage?: string;
}

export interface IUserFilters {
  role?: string;
  status?: string;
  searchTerm?: string;
}
