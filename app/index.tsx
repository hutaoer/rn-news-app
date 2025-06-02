import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Text, TouchableOpacity, View } from "react-native";

interface NewsItem {
  id: number;
  title: string;
  url?: string;
  by: string;
  time: number;
  score: number;
}

export default function Index() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [allStoryIds, setAllStoryIds] = useState<number[]>([]);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchHackerNews();
  }, []);

  const fetchHackerNews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
        setCurrentPage(0);
        setNews([]);
      }

      // 获取最新新闻ID列表（只在刷新或首次加载时获取）
      if (isRefresh || allStoryIds.length === 0) {
        const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const topStoryIds = await topStoriesResponse.json();
        setAllStoryIds(topStoryIds);
        
        // 获取第一页数据
        const firstPageIds = topStoryIds.slice(0, PAGE_SIZE);
        const newsPromises = firstPageIds.map(async (id: number) => {
          const itemResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          return itemResponse.json();
        });
        
        const newsItems = await Promise.all(newsPromises);
        setNews(newsItems);
        setCurrentPage(1);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取新闻失败:', error);
      setLoading(false);
    }
  };

  const loadMoreNews = async () => {
    if (loadingMore || currentPage * PAGE_SIZE >= allStoryIds.length) {
      return;
    }

    setLoadingMore(true);
    
    try {
      const startIndex = currentPage * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const nextPageIds = allStoryIds.slice(startIndex, endIndex);
      
      const newsPromises = nextPageIds.map(async (id: number) => {
        const itemResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return itemResponse.json();
      });
      
      const moreNewsItems = await Promise.all(newsPromises);
      setNews(prevNews => [...prevNews, ...moreNewsItems]);
      setCurrentPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error('加载更多新闻失败:', error);
    }
    
    setLoadingMore(false);
  };

  const openUrl = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity 
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      }}
      onPress={() => item.url && openUrl(item.url)}
    >
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 12, color: '#666' }}>
        作者: {item.by} | 评分: {item.score} | 时间: {new Date(item.time * 1000).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#0000ff" />
        <Text style={{ marginTop: 8, color: '#666' }}>加载更多...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 16 }}>加载Hacker News...</Text>
      </View>
    );
  }

  return (
    <React.Fragment>
      <Stack.Screen options={{ title: "首页" }} />
      <View style={{ flex: 1, paddingTop: 50 }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: 20,
          paddingHorizontal: 16 
        }}>
          Hacker News 最新新闻
        </Text>
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={loading}
          onRefresh={() => fetchHackerNews(true)}
          onEndReached={loadMoreNews}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      </View>
    </React.Fragment>
  );
}
