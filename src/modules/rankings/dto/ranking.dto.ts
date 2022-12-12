export class RankingDto {
  date: string;
  group: 'singles' | 'doubles' | 'race' | 'surface' | 'prize';
  countryAcr?: string;
  page?: number;
}
