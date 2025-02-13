import React, { useEffect, useRef, useState } from "react";
import Navbar from "components/Navbar";
import Home from "components/Home";
import Menubar from "components/Menubar";
import Breaking from "components/Breaking";
import Footer from "components/Footer";
import useNewsStore from 'store/newsStore';

const Main: React.FC = () => {
  const setNews = useNewsStore((state) => state.setNews);
  const news = useNewsStore((state) => state.news); 
  const [menu, setMenu] = useState<string>("Politics");
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const searchRef = useRef<HTMLInputElement | null>(null);

  const getNews = async () => {
    try {
      setIsLoading(true);
      const strapiResponse = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/articles?populate=*`);
      const strapiData = await strapiResponse.json();

      const strapiArticles = strapiData.data.map((item: any) => {
        const attributes = item || {};
        const blocks = attributes.blocks
          .map((block: any) => {
            if (block.__component === "shared.quote") {
              return { type: "quote", title: block.title, body: block.body };
            } else if (block.__component === "shared.rich-text") {
              return { type: "rich-text", body: block.body };
            } else if (block.__component === "shared.you-tube-video") {
              return {
                type: "you-tube-video",
                url: block.URL,
                description: block.Description,
              };
            }
            return null;
          })
          .filter(Boolean); // to remove any null values

        return {
          id: attributes.id,
          title: attributes.title || "No title available",
          description: attributes.description || "No description available",
          slug: attributes.slug || "No slug available",
          cover: attributes.cover,
          blocks: blocks,
        };
      });

      const externalResponse = await fetch(`https://newsapi.org/v2/everything?q=${menu ? menu : "politics"}&sortBy=popularity&apiKey=7c73bb31409f4f66958cadb605ae0bce`);
      const externalData = await externalResponse.json();
      const externalArticles = externalData.articles || [];

      const filteredExternalArticles = externalArticles.filter((article: any) => article.title !== "[Removed]");
      
      setNews([...strapiArticles, ...filteredExternalArticles]);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching news:", err);
    }
  };

  useEffect(() => {
    if (!news.length) {
      getNews();
    }
    // eslint-disable-next-line
  }, [menu]);

  return (
    <>
      <Navbar setMenu={setMenu} setSearch={setSearch} searchRef={searchRef} />
      <Menubar news={news} />
      <div className="main-content">
        <div className="px-4">
          <Breaking news={news} menu={menu} isLoading={isLoading} />
          <Home news={news} search={search} isLoading={isLoading} />
        </div>
      </div>
      <Footer setMenu={setMenu} />
    </>
  );
};

export default Main;
