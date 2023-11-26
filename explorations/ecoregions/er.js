import * as create from './create/index.js';
import * as insert from './insert/index.js';

create.treatments.tr();
create.materialCitations.mc();
create.materialCitations.mc();
create.materialCitations.mc_geopoly();
create.materialCitations.mc_trigg();
create.ecoregions.er();
create.ecoregions.er_geopoly();
create.ecoregions.er_trigg();

insert.treatments.tr();
insert.ecoregions.er();
insert.materialCitations.mc();