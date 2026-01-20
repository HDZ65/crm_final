export class ThemeMarqueDto {
  id: string;
  logoUrl: string;
  couleurPrimaire: string;
  couleurSecondaire: string;
  faviconUrl: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ThemeMarqueDto>) {
    Object.assign(this, partial);
  }
}
