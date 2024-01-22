import React, { useEffect, useState, useRef } from "react";

import * as S from "./DashboardStyles";

import Header from "../../components/Header";
import axios from "axios";
import { Progress, Button, Table, Badge } from "flowbite-react";
import { useToast } from "../../context/ToastContext";

interface Product {
  sku: string;
  link: string;
  name: string;
  status: string;
  nowPrice: number;
  lastPrice: number;
  image: string;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);

  const [link, setLink] = useState("");
  const [percent, setPercent] = useState("");
  const [onUpdate, setOnUpdate] = useState(false);
  const [load, setLoad] = useState("none");
  const [skusUpdated, setSkusUpdated] = useState<any>([]);

  const isMounted = useRef(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    await axios
      .get("https://server-zfw1.onrender.com/links/")
      .then(({ data: response }) => {
        setProducts(response);
      })
      .catch((err) => console.log(err));
  };

  const AddLink = () => {
    setLoad("addLink");
    axios
      .post("https://server-zfw1.onrender.com/links/", { link: link })
      .then(({ data }) => {
        console.log(data);

        setProducts([...products, { ...data }]);

        setLink("");
      })
      .catch((error: any) => {
        addToast(
          "Problema ao adicionar, verifique se o link esta disponivel",
          "error"
        );
      })
      .finally(() => setLoad("none"));
  };

  const deleteItem = ({ sku }: any) => {
    setLoad("delete");
    axios
      .delete(`https://trail-river-coriander.glitch.me/delete/${sku}`)
      .then(() => {
        setProducts((data) => data.filter((item) => item.sku != sku));
      })
      .catch((error) => {
        console.log("Error :", error);
      })
      .finally(() => setLoad("none"));
  };

  const updateAll = () => {
    const eventSource = new EventSource(
      "https://server-zfw1.onrender.com/links/update"
    );

    setOnUpdate(true);
    setPercent("0%");

    eventSource.onmessage = (event) => {
      const progress = event.data;
      if (progress.indexOf("%") != -1) {
        setPercent(progress);
      } else {
        const productAtt = JSON.parse(event.data);

        setSkusUpdated((skusUpdated: any) => [...skusUpdated, productAtt.sku]);

        setProducts((prevProducts) => {
          const refreshedProducts = prevProducts.map((product) => {
            if (product.sku === productAtt.sku) {
              return {
                ...product,
                nowPrice: productAtt.nowPrice,
                lastPrice: productAtt.lastPrice,
              };
            }
            return product;
          });
          return refreshedProducts;
        });

        addToast(`${productAtt.name} Atualizado`, "success");
      }
    };

    eventSource.onerror = (error) => {
      console.error("Erro na conexão SSE:", error);
      eventSource.close();
      setOnUpdate(false);
      setTimeout(() => {
        setSkusUpdated([]);
      }, 2000);
    };
  };

  const calcularDiferencaPercentual = (
    numeroAntigo: number,
    numeroNovo: number
  ) => {
    var diferenca = numeroNovo - numeroAntigo;

    var diferencaPercentual = (diferenca / Math.abs(numeroAntigo)) * 100;

    return `${parseFloat(diferencaPercentual.toFixed(2))}%`;
  };

  if (products.length === 0) return <>Carregando</>;

  return (
    <div className="min-h-full">
      <Header />

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard Crawler Links ld+json
          </h1>
          {onUpdate && (
            <Progress
              progress={Number(percent.replace("%", ""))}
              progressLabelPosition="inside"
              textLabel="Atualizando lista"
              textLabelPosition="outside"
              color="gray"
              size="lg"
              labelProgress
              labelText
            />
          )}
        </div>
      </header>
      <S.Main>
        <div className="mx-auto flex gap-5 max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="sm:col-span-12">
            <div className="mt-2">
              <input
                style={{ padding: "5px" }}
                onChange={(e) => setLink(e.target.value)}
                value={link}
                id="email"
                name="email"
                placeholder="Link"
                type="email"
                autoComplete="email"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="mt-6 flex items-center justify-start gap-x-6">
              <Button
                onClick={AddLink}
                isProcessing={load === "addLink" ? true : false}
                disabled={load === "addLink" ? true : false}
                size="sm"
                color="gray"
              >
                Add
              </Button>
              <Button
                isProcessing={onUpdate ? true : false}
                disabled={onUpdate ? true : false}
                onClick={updateAll}
                size="sm"
                color="gray"
              >
                {onUpdate ? "Atualizando" : "Atualizar tudo"}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table striped hoverable>
              <Table.Head>
                <Table.HeadCell>Imagem</Table.HeadCell>
                <Table.HeadCell>Nome</Table.HeadCell>
                <Table.HeadCell>Preço atual</Table.HeadCell>
                <Table.HeadCell>Ultimo preço</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Variação</Table.HeadCell>
                <Table.HeadCell>
                  <span className="sr-only">remmove</span>
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {products?.map((product) => {
                  return (
                    <Table.Row
                      key={product.sku}
                      className={`bg-white dark:border-gray-700 dark:bg-gray-800 ${
                        skusUpdated.includes(product.sku) ? "ok" : ""
                      }`}
                    >
                      <Table.Cell>
                        <img
                          alt={product.name}
                          title={product.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "scale-down",
                          }}
                          src={product.image}
                        />
                      </Table.Cell>
                      <Table.Cell
                        title={product.name}
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                      >
                        {product.name.length > 30
                          ? `${product.name.slice(0, 30)}...`
                          : product.name}
                      </Table.Cell>
                      <Table.Cell>R${product.nowPrice}</Table.Cell>
                      <Table.Cell>R${product.lastPrice}</Table.Cell>
                      <Table.Cell>
                        {product.status.indexOf("InStock") != -1 ||
                        product.nowPrice != 0 ? (
                          <Badge color="success">ON</Badge>
                        ) : (
                          <Badge color="failure">OFF</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        R$
                        {product.lastPrice !== product.nowPrice
                          ? (product.nowPrice - product.lastPrice).toFixed(2)
                          : 0}
                        (
                        {calcularDiferencaPercentual(
                          product.lastPrice,
                          product.nowPrice
                        )}
                        )
                      </Table.Cell>

                      <Table.Cell>
                        <a
                          href="#"
                          className="font-medium text-red-600 hover:underline dark:text-cyan-500 isProcessing"
                          onClick={() => deleteItem(product)}
                        >
                          Remover
                        </a>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        </div>
      </S.Main>
    </div>
  );
}
