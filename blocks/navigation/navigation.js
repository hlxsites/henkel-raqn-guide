
import Column from "../column/column.js";

export default class Navigation extends Column {
    connected() {
        console.log('Navigation', this);
    }
}
