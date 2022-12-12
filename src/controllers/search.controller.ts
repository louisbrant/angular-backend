import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from 'src/services/search.service';

@Controller('tennis/api2/search')
@ApiTags('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get(':search')
  elasticSearch(@Param('search') search: string) {
    return this.searchService.elasticSearch(search);
  }

  @Get(':search/:category')
  searchByCategory(
    @Param('search') search: string,
    @Param('category') category: string,
  ) {
    return this.searchService.searchByCategory(search, category);
  }
}
