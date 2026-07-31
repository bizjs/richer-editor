import DefaultTheme from 'vitepress/theme';
import { withReactDemo } from 'vitepress-plugin-react-demo/client';
import 'vitepress-plugin-react-demo/style.css';

export default withReactDemo(DefaultTheme);
