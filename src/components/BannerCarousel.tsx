import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '@theme/colors';
import { api } from '@api/api';
import { resolveImageUrl } from '@config/env';

type Banner = {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  width?: number;
  height?: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_BANNER_ASPECT_RATIO = 3;
const INTERVAL_MS = 4000;

const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        let res = await api.banners.getAll('mobile');
        if (res.success && res.data?.length) {
          setBanners(res.data);
        } else {
          res = await api.banners.getAll();
          if (res.success && res.data?.length) {
            setBanners(res.data);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }
    intervalRef.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex, banners.length]);

  const onMomentumEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(idx);
  };

  const handlePress = (banner: Banner) => {
    if (banner.linkUrl) {
      Linking.openURL(banner.linkUrl);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const activeBanner = banners[currentIndex];
  const bannerAspectRatio =
    activeBanner?.width && activeBanner?.height
      ? activeBanner.width / activeBanner.height
      : DEFAULT_BANNER_ASPECT_RATIO;
  const bannerHeight = Math.round(SCREEN_WIDTH / bannerAspectRatio);

  const renderItem = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handlePress(item)}
      style={[styles.bannerWrap, { height: bannerHeight }]}
    >
      <Image
        source={{ uri: resolveImageUrl(item.imageUrl) }}
        style={styles.bannerImage}
        resizeMode="contain"
      />
      {(item.title || item.description) && (
        <View style={styles.overlay}>
          {item.title && <Text style={styles.overlayTitle}>{item.title}</Text>}
          {item.description && (
            <Text style={styles.overlayDesc} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        bounces={false}
      />
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    width: '100%',
    aspectRatio: DEFAULT_BANNER_ASPECT_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  bannerWrap: {
    width: SCREEN_WIDTH,
    backgroundColor: '#eff6ff',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  overlayDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 20,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});

export default BannerCarousel;
