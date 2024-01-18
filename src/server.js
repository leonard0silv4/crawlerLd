const express = require("express");
const app = express();
const fs = require("fs");

app.use(express.json());
const superagent = require("superagent");
const cheerio = require("cheerio");
const cors = require("cors");

app.use(cors());

const port = 8081;

const getDataWithRetry = async (url, maxRetries = 3) => {
  let tentativaAtual = 1;

  while (tentativaAtual <= maxRetries) {
    try {
      const response = await superagent.get(url).timeout({
        response: 5000,
        deadline: 10000,
      });

      console.log("🚀 ~ getData ~ url Buscando:", url);

      const $ = cheerio.load(response.text);
      const jsonRaw = $("script[type='application/ld+json']")[0].children[0]
        .data;
      const result = JSON.parse(jsonRaw);

      return result;
    } catch (error) {
      console.error(
        `Tentativa ${tentativaAtual} falhou durante a busca para ${url}:`,
        error
      );
      tentativaAtual++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Falha após ${maxRetries} tentativas para ${url}`);
};

const updateItem = (response, json, link, res = undefined) => {
  try {
    const currentSearchResult = {
      sku: response.sku,
      link: link,
      name: response.name,
      status: response.offers.availability,
      nowPrice: Number(response.offers.price),
      lastPrice: Number(response.offers.price),
      image: response.image,
    };

    const existingItemIndex = json.findIndex((item) => item.link === link);

    if (existingItemIndex !== -1) {
      
      json[existingItemIndex].status = currentSearchResult.status;
      if (json[existingItemIndex].nowPrice != currentSearchResult.nowPrice) {
        res.write(`data: ${currentSearchResult.name}\n\n`);  

        json[existingItemIndex].lastPrice = json[existingItemIndex].nowPrice;
        json[existingItemIndex].nowPrice = currentSearchResult.nowPrice;
      }
    } else {
      json.push(currentSearchResult);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

app.get("/", (req, res) => {
  res.send("web crawler");
});


app.get("/links", (req, res) => {
  
  const data = fs.readFileSync("./database.json");
  const json = JSON.parse(data);

  res.json(json);
});

app.post("/save", async (req, res) => {
  try {
    const response = await getDataWithRetry(req.body.link);

    const data = fs.readFileSync("./database.json");
    const json = JSON.parse(data);

    updateItem(response, json, req.body.link);

    fs.writeFileSync("./database.json", JSON.stringify(json, null, 2));

    res.json(json);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/updateAll", async (req, res) => {
  const data = fs.readFileSync("./database.json");
  const json = JSON.parse(data);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  for (let i = 0; i < json.length; i++) {
    try {
      const response = await getDataWithRetry(json[i].link);

      updateItem(response, json, json[i].link , res);

      const percent = ((i + 1) / json.length) * 100;

      res.write(`data: ${percent.toFixed(0)}%\n\n`);
    } catch (error) {
      console.error(`Erro durante a busca para ${json[i].link}`, error);
    }
  }
  fs.writeFileSync("./database.json", JSON.stringify(json, null, 2));
  
  res.end();
});

app.delete("/delete/:sku", (req, res) => {
  const { sku } = req.params;

  try {
    const data = fs.readFileSync("./database.json");
    const json = JSON.parse(data).filter((item) => item.sku != sku);

    fs.writeFileSync("./database.json", JSON.stringify(json, null, 2));
  } catch (error) {
    console.error(`Erro na exclusão ${sku} :`, error);
  }
  res.end();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
