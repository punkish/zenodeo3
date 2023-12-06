import * as create from './create/index.js';
import * as insert from './insert/index.js';

create.ecoregions.er();
create.ecoregions.bm();
create.ecoregions.er_geopoly();
create.ecoregions.er_trigg();
create.treatments.tr();
create.materialCitations.mc();
create.materialCitations.mc_geopoly();
create.materialCitations.mc_trigg();

insert.ecoregions.er();
//insert.ecoregions.bm();
insert.treatments.tr();
insert.materialCitations.mc();