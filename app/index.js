import { startHotAppLoop, History } from "cx/ui";
import { Debug } from "cx/util";
import Routes from "./routes";
import "./index.scss";

import { Store } from "cx/data";
const store = new Store();

History.connect(
  store,
  "url"
);

Debug.enable("app-data");

startHotAppLoop(module, document.getElementById("app"), store, Routes);
