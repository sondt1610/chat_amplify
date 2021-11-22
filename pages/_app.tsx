import '../styles/globals.css'
import type { AppProps } from 'next/app'
import "../styles/globals.css";
import Amplify from "aws-amplify";
import awsconfig from "../src/aws-exports";
Amplify.configure({ ...awsconfig});

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
export default MyApp
