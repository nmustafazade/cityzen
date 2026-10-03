import "dotenv/config";
import {
  closeOsmImporter,
  importOsmInfrastructure,
} from "../src/integrations/osm/osm-infrastructure.service";

function coordinate(name: string, min: number, max: number) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value < min || value > max)
    throw new Error(`${name} must be configured between ${min} and ${max}`);
  return value;
}
async function main() {
  const bounds = {
    south: coordinate("OSM_IMPORT_SOUTH", -90, 90),
    west: coordinate("OSM_IMPORT_WEST", -180, 180),
    north: coordinate("OSM_IMPORT_NORTH", -90, 90),
    east: coordinate("OSM_IMPORT_EAST", -180, 180),
  };
  if (bounds.north <= bounds.south || bounds.east <= bounds.west)
    throw new Error("OSM import bounds are invalid");
  const result = await importOsmInfrastructure(bounds);
  for (const [name, stats] of Object.entries(result))
    console.log(
      `${name}: Fetched ${stats.fetched}, Created ${stats.created}, Updated ${stats.updated}, Skipped ${stats.skipped}`,
    );
}
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "OSM import failed");
    process.exitCode = 1;
  })
  .finally(closeOsmImporter);
