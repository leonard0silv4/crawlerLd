import React, { useEffect, useState, useRef } from "react";

import * as S from "./DashboardStyles";

import Header from "../../components/Header";
import instance from "../../config/axios";
import {
  Progress,
  Button,
  Table,
  Badge,
  TextInput,
  Spinner,
} from "flowbite-react";
import { useToast } from "../../context/ToastContext";
import Pages from "../../components/Pagination";

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
  const [load, setLoad] = useState("");
  const [skusUpdated, setSkusUpdated] = useState<any>([]);
  const [page, setPage] = useState(1);
  const [isMount, setIsMount] = useState(true);
  const [loadFetch, setLoadFetch] = useState(true);

  const [pagination, setPagination] = useState({
    currPage: page,
    setPage,
    totalPages: 1,
  });

  const isMounted = useRef(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;
    fetchData();
  }, []);

  useEffect(() => {
    if (isMount) {
      setIsMount(false);
      return;
    }

    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoadFetch(true);
    await instance
      .get("links", {
        params: {
          page: page,
          perPage: 5,
        },
      })
      .then(({ data: response, metadata }: any) => {
        setPagination({
          ...pagination,
          totalPages: Math.ceil(metadata.totalCount / 5),
        });
        setProducts(response);
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setLoadFetch(false);
      });
  };

  const AddLink = () => {
    try {
      Boolean(new URL(link));
    } catch (e) {
      addToast(
        "Problema ao adicionar, verifique se o link esta disponivel",
        "error"
      );
      return;
    }
    setLoad("addLink");
    instance
      .post("links", { link: link })
      .then(() => {
        fetchData();
        setLink("");
      })
      .catch((error: any) => {
        addToast(
          "Problema ao adicionar, verifique se o link esta disponivel",
          "error"
        );
      })
      .finally(() => setLoad(""));
  };

  const deleteItem = ({ sku }: any) => {
    setLoad("delete");
    instance
      .delete(`links/${sku}`)
      .then(() => {
        setProducts((data) => data.filter((item) => item.sku != sku));
        fetchData();
      })
      .catch((error) => {
        console.log("Error :", error);
      })
      .finally(() => setLoad(""));
  };

  const updateAll = () => {
    const eventSource = new EventSource(
      `${process.env.REACT_APP_BASE_URL}links/update`
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
        updateAnExist(productAtt);
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

  const updateAnExist = (newProduct: Product) => {
    setProducts((prevProducts) => {
      const refreshedProducts = prevProducts.map((product) => {
        if (product.sku === newProduct.sku) {
          return {
            ...product,
            nowPrice: newProduct.nowPrice,
            lastPrice: newProduct.lastPrice,
          };
        }
        return product;
      });
      return refreshedProducts;
    });
  };

  return (
    <div className="min-h-full">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Links cadastrados
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
      <S.Main className="mt-5">
        <div className="mx-auto flex-row flex gap-5 max-w-7xl xs:flex-col">
          <div className="basis-1/4 ">
            <div className="mt-2">
              <TextInput
                onChange={(e) => setLink(e.target.value)}
                id="utl"
                type="url"
                value={link}
                placeholder="URL"
                required
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
                Adicionar
              </Button>
            </div>
          </div>

          <div className="sm:overflow-x-auto basis-3/4">
            {loadFetch ? (
              <div className="mx-auto text-center	mt-6">
                <Spinner aria-label="Extra large spinner example" size="xl" />
              </div>
            ) : (
              <>
                {products.length > 0 && (
                  <Table striped hoverable>
                    <Table.Head>
                      <Table.HeadCell>Imagem</Table.HeadCell>
                      <Table.HeadCell>Nome</Table.HeadCell>
                      <Table.HeadCell>Preço atual</Table.HeadCell>
                      <Table.HeadCell>Ultimo preço</Table.HeadCell>
                      <Table.HeadCell>Status</Table.HeadCell>
                      <Table.HeadCell>Variação</Table.HeadCell>
                      <Table.HeadCell>
                        <Button
                          isProcessing={onUpdate ? true : false}
                          disabled={onUpdate ? true : false}
                          onClick={updateAll}
                          size="xs"
                          color="dark"
                        >
                          {onUpdate ? "..." : "Atualizar \n Lista"}
                        </Button>
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
                                ? (
                                    product.nowPrice - product.lastPrice
                                  ).toFixed(2)
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
                )}
                {pagination.totalPages > 1 && (
                  <Pages
                    currPage={page}
                    setPage={pagination.setPage}
                    totalPages={pagination.totalPages}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </S.Main>
    </div>
  );
}
