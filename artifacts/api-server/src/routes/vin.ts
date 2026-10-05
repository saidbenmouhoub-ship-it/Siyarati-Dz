import { Router, type IRouter } from "express";
import {
  DecodeVinQueryParams,
  DecodeVinResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const nhtsaEndpoint =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";
const requestTimeoutMs = 12_000;

type NhtsaRecord = Record<string, unknown>;

function readNhtsaText(record: NhtsaRecord, key: string): string | null {
  const value = record[key];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function joinAvailable(values: Array<string | null>): string | null {
  const joined = values.filter((value): value is string => Boolean(value)).join(" · ");
  return joined || null;
}

function apiError(error: string): { error: string } {
  return { error };
}

router.get("/vin/decode", async (req, res): Promise<void> => {
  const params = DecodeVinQueryParams.safeParse({
    vin: typeof req.query.vin === "string" ? req.query.vin.trim().toUpperCase() : "",
  });

  if (!params.success) {
    res
      .status(400)
      .json(apiError("VIN must contain 17 valid characters (excluding I, O and Q)."));
    return;
  }

  const url = new URL(`${nhtsaEndpoint}/${encodeURIComponent(params.data.vin)}`);
  url.searchParams.set("format", "json");

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!upstream.ok) {
      req.log.warn(
        { statusCode: upstream.status },
        "NHTSA vPIC returned an unsuccessful status",
      );
      res
        .status(502)
        .json(
          apiError(
            "The NHTSA vPIC service is temporarily unavailable. Please try again.",
          ),
        );
      return;
    }

    const payload: unknown = await upstream.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      !("Results" in payload) ||
      !Array.isArray(payload.Results)
    ) {
      req.log.warn("NHTSA vPIC returned an unexpected response");
      res
        .status(502)
        .json(apiError("The NHTSA vPIC response could not be read."));
      return;
    }

    const firstResult = payload.Results[0];
    const record =
      firstResult && typeof firstResult === "object"
        ? (firstResult as NhtsaRecord)
        : {};

    const make = readNhtsaText(record, "Make");
    const model = readNhtsaText(record, "Model");
    const modelYear = readNhtsaText(record, "ModelYear");
    const displacementL = readNhtsaText(record, "DisplacementL");
    const displacementCc = readNhtsaText(record, "DisplacementCC");
    const engineHp = readNhtsaText(record, "EngineHP");
    const engineKw = readNhtsaText(record, "EngineKW");
    const engine = joinAvailable([
      readNhtsaText(record, "EngineModel"),
      readNhtsaText(record, "EngineConfiguration"),
      readNhtsaText(record, "EVDriveUnit"),
      readNhtsaText(record, "ElectrificationLevel"),
      readNhtsaText(record, "EngineManufacturer"),
      readNhtsaText(record, "EngineCylinders")
        ? `${readNhtsaText(record, "EngineCylinders")} cylinders`
        : null,
      displacementL
        ? `${displacementL} L`
        : displacementCc
          ? `${displacementCc} cc`
          : null,
      engineHp
        ? `${engineHp} hp`
        : engineKw
          ? `${engineKw} kW`
        : null,
      readNhtsaText(record, "OtherEngineInfo"),
    ]);

    const safetyFields: Array<[string, string]> = [
      ["ABS", "ABS"],
      ["AirBagLocFront", "Front airbags"],
      ["AirBagLocSide", "Side airbags"],
      ["AirBagLocCurtain", "Curtain airbags"],
      ["ESC", "Electronic stability control"],
      ["TractionControl", "Traction control"],
      ["TPMS", "Tire pressure monitoring"],
    ];

    const safetyEquipment = safetyFields.flatMap(([field, label]) => {
      const value = readNhtsaText(record, field);
      return value && !/^(not applicable|not available)$/i.test(value)
        ? [`${label}: ${value}`]
        : [];
    });

    const data = DecodeVinResponse.parse({
      vin: params.data.vin,
      decoded: Boolean(make && model && modelYear),
      make,
      model,
      modelYear,
      trim: readNhtsaText(record, "Trim"),
      series: readNhtsaText(record, "Series"),
      engine,
      fuelType: readNhtsaText(record, "FuelTypePrimary"),
      transmission: readNhtsaText(record, "TransmissionStyle"),
      bodyClass: readNhtsaText(record, "BodyClass"),
      assemblyCountry: readNhtsaText(record, "PlantCountry"),
      assemblyPlant: joinAvailable([
        readNhtsaText(record, "PlantCompanyName"),
        readNhtsaText(record, "PlantCity"),
        readNhtsaText(record, "PlantState"),
      ]),
      safetyEquipment,
      errorCode: readNhtsaText(record, "ErrorCode"),
      errorMessage: readNhtsaText(record, "ErrorText"),
    });

    res.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      res
        .status(504)
        .json(
          apiError(
            "The NHTSA vPIC service did not respond in time. Please try again.",
          ),
        );
      return;
    }

    req.log.error({ err: error }, "Could not decode VIN through NHTSA vPIC");
    res
      .status(502)
      .json(apiError("Could not reach the NHTSA vPIC service. Please try again."));
  }
});

export default router;
