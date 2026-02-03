import { Dish } from './types';
import defaultMenu from './defaultMenu.json';

export const DISHES_PER_PAGE = 10;

export const TRANSLATIONS = {
  en: {
    restaurantName: "Savèurs d’Alan",
    restaurantNameZh: "岚",
    seasonalMenu: "Seasonal Tasting Menu",
    chefsSpecial: "Chef's Special",
    yourSelection: "Your Selection",
    clear: "Clear",
    closeSelection: "Close Selection",
    personalList: "Alan's customized menu, exclusive for private use.",
    menuManagement: "Menu Management",
    addDish: "Add Dish",
    import: "Import",
    export: "Export",
    cuisine: "Category",
    dishName: "Dish Name",
    description: "Description...",
    videoUrl: "Video URL",
    spiciness: "Spiciness:",
    sweetness: "Sweetness:",
    featured: "Featured",
    directory: "Directory",
    emptyCart: "Your selection is empty.",
    noDishes: "No enabled dishes to display.",
    deleteConfirm: "Are you sure you want to delete this dish?",
    untitled: "Untitled",
    newSection: "New Section",
    newDish: "New Dish",
    toggleVisibility: "Toggle Visibility",
    watchVideo: "Watch Video",
    thinking: "Thinking...",
    aiPolish: "AI Polish"
  },
  zh: {
    restaurantName: "Savèurs d’Alan",
    restaurantNameZh: "岚",
    seasonalMenu: "季节性品鉴菜单",
    chefsSpecial: "主厨推荐",
    yourSelection: "已选菜品",
    clear: "清空",
    closeSelection: "关闭列表",
    personalList: "阿兰定制菜单，私人专享",
    menuManagement: "菜单管理",
    addDish: "添加菜品",
    import: "导入",
    export: "导出",
    cuisine: "分类",
    dishName: "菜名",
    description: "描述...",
    videoUrl: "视频链接",
    spiciness: "辣度:",
    sweetness: "甜度:",
    featured: "推荐",
    directory: "目录",
    emptyCart: "购物车为空。",
    noDishes: "暂无可用菜品。",
    deleteConfirm: "确定要删除这道菜吗？",
    untitled: "未命名",
    newSection: "新分类",
    newDish: "新菜品",
    toggleVisibility: "切换可见性",
    watchVideo: "观看视频",
    thinking: "思考中...",
    aiPolish: "AI 润色"
  }
};

export const INITIAL_DISHES: Dish[] = defaultMenu.map((dish) => ({
  id: dish.id,
  category: dish.category,
  name: dish.name,
  description: dish.description,
  tags: dish.tags ?? [],
  spiciness: dish.spiciness,
  sweetness: dish.sweetness,
  featured: dish.featured,
  enabled: dish.enabled,
  video_url: dish.video_url
}));