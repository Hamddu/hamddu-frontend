import React from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import {
  Avatar,
  Title,
  Paragraph,
  Card,
  List,
  Divider,
  Text,
} from "react-native-paper";
import { usePostsByAuthor } from "../hooks/usePosts";

export default function ProfileScreen() {
  const currentUser = "뜨개왕초보"; // Example user
  const { data: myPosts, isLoading } = usePostsByAuthor(currentUser);

  const totalLikes = myPosts?.reduce((sum, post) => sum + post.likes, 0) || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image
          size={80}
          source={{ uri: "https://i.pravatar.cc/150?img=12" }}
        />
        <Title style={styles.name}>뜨개왕초보</Title>
        <Paragraph style={styles.bio}>
          뜨개질을 사랑하는 초보자입니다 🧶
        </Paragraph>
      </View>

      <Card style={styles.statsCard}>
        <Card.Content style={styles.stats}>
          <View style={styles.stat}>
            <Title>{myPosts?.length || 0}</Title>
            <Paragraph>작품</Paragraph>
          </View>
          <View style={styles.stat}>
            <Title>{totalLikes}</Title>
            <Paragraph>좋아요</Paragraph>
          </View>
          <View style={styles.stat}>
            <Title>24</Title>
            <Paragraph>팔로워</Paragraph>
          </View>
        </Card.Content>
      </Card>

      <Title style={styles.sectionTitle}>내 작품</Title>
      {myPosts?.map((post: any) => (
        <List.Item
          key={post.id}
          title={post.title}
          description={`좋아요 ${post.likes}`}
          left={(props) => <List.Icon {...props} icon="image" />}
          style={styles.listItem}
        />
      ))}

      <Divider style={styles.divider} />

      <Title style={styles.sectionTitle}>설정</Title>
      <List.Item
        title="프로필 수정"
        left={(props) => <List.Icon {...props} icon="account-edit" />}
        onPress={() => {}}
      />
      <List.Item
        title="알림 설정"
        left={(props) => <List.Icon {...props} icon="bell" />}
        onPress={() => {}}
      />
      <List.Item
        title="로그아웃"
        left={(props) => <List.Icon {...props} icon="logout" />}
        onPress={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#5A37A2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  name: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  bio: {
    color: "#999999",
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
  },
  statsCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#5A37A2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    padding: 4,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sectionTitle: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#5A37A2",
  },
  listItem: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: "#E0E0E0",
    height: 1,
  },
});
