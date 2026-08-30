"use strict";

/**
 * NHIMY — Research Provider
 *
 * Provedor inicial:
 * Europe PMC
 *
 * Responsabilidade:
 * Pesquisar literatura científica e transformar
 * os resultados em fontes compatíveis com o NHIMY.
 */

const EUROPE_PMC_URL =
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search";


export async function searchEuropePMC(
  query,
  {
    pageSize = 5,
    retries = 3
  } = {}
) {
  if (
    typeof query !== "string" ||
    !query.trim()
  ) {
    throw new Error("Query de pesquisa inválida.");
  }

  const url = new URL(EUROPE_PMC_URL);

  url.searchParams.set(
    "query",
    query.trim()
  );

  url.searchParams.set(
    "resultType",
    "core"
  );

  url.searchParams.set(
    "format",
    "json"
  );

  url.searchParams.set(
    "pageSize",
    String(pageSize)
  );

  const https =
    await import("node:https");

  let lastError;

  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
    try {
      const result =
        await new Promise(
          (resolve, reject) => {

            const request =
              https.get(
                url,
                response => {
                  let data = "";

                  response.setEncoding("utf8");

                  response.on(
                    "data",
                    chunk => {
                      data += chunk;
                    }
                  );

                  response.on(
                    "end",
                    () => {

                      if (
                        response.statusCode < 200 ||
                        response.statusCode >= 300
                      ) {
                        reject(
                          new Error(
                            `Europe PMC respondeu com HTTP ${response.statusCode}.`
                          )
                        );

                        return;
                      }

                      try {
                        resolve(
                          JSON.parse(data)
                        );
                      } catch (error) {
                        reject(
                          new Error(
                            "Resposta inválida do Europe PMC."
                          )
                        );
                      }
                    }
                  );
                }
              );

            request.on(
              "error",
              reject
            );

            request.setTimeout(
              30000,
              () => {
                request.destroy(
                  new Error(
                    "Tempo limite ao consultar o Europe PMC."
                  )
                );
              }
            );
          }
        );

      return result;

    } catch (error) {
      lastError = error;

      const retryable =
        [
          "ECONNRESET",
          "ETIMEDOUT",
          "EAI_AGAIN",
          "ECONNREFUSED",
          "ENETUNREACH"
        ].includes(error?.code);

      if (
        !retryable ||
        attempt === retries
      ) {
        throw error;
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            attempt * 1000
          )
      );
    }
  }

  throw lastError;
}


export function normalizeEuropePMCResult(
  article = {}
) {
  const title =
    typeof article.title === "string"
      ? article.title.trim()
      : "";

  const url =
    article.fullTextUrlList?.fullTextUrl?.[0]?.url ||
    (
      article.pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`
        : ""
    );

  const publisher =
    article.journalTitle ||
    "Europe PMC";

  return {
    title,
    url,
    publisher,

    abstract:
      typeof article.abstractText === "string"
        ? article.abstractText.trim()
        : "",

    authors:
      Array.isArray(article.authorList?.author)
        ? article.authorList.author.map(
            author => ({
              firstName:
                author.firstName || "",
              lastName:
                author.lastName || ""
            })
          )
        : [],

    publicationDate:
      article.firstPublicationDate || "",

    sourceId:
      article.id || "",

    sourceDatabase:
      article.source || "Europe PMC"
  };
}


export function normalizeEuropePMCResults(
  data = {}
) {
  const articles =
    Array.isArray(data.resultList?.result)
      ? data.resultList.result
      : [];

  return articles
    .map(normalizeEuropePMCResult)
    .filter(article =>
      article.title &&
      article.url
    );
}
