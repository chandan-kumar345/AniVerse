"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function main() {
    const watchUrl = 'https://aniwaves.ru/watch/ore-dake-level-up-na-ken-76040';
    // DUB BYFMS:
    const dubByfms = 'UWxwb05ERkJXU1pUV2Q5Tm5RSUFBQW4vLzluVkNJVGtVT1FGamhyOFNMZ0FZQktVQ3dlS1FJUWxBRkFCSUFqb0NnRXFJQUIwTVJwcGtCa2FCb3laRFJvQnBpTkdtbW1qTlQxQjVNb2M5UTBNRTAwd21UUTBNVFJvYVlhUURURUhvbWpFR0FFRmV0WlFFRmVJN2c3TUFqekx2Z2oxcDhYRlZsdllsWlcyOVZ2OEp6cG9mR0NoeTdGQnh2OFJkSndPQkxENDY4a21vb3dSQS9CK1FTa0NLWVRVL1lqMWdmc3Ywb3hrSkdXMy9GM0pGT0ZDUTMwMmRBZz0=';
    // DUB DGHG:
    const dubDghg = 'UWxwb05ERkJXU1pUV2ZBYkRsWUFBQXAvLy9sMkFJejFBRHpDTkFra0ZFZ1FhQ3NBZUlad3ZFRkFTRUF4WVI2UmlJRUFJQUIwT0FOQUdUUUFHbVFOQTBBMDBOQTJvMDlIcUcxREo2aDZnQUdtaGtNUU1ScGt5YU5NbWFJd0lEVFRBZ1ZBTU1rQU9KVWY0V1FkeVRUc3ZWejNQUTd5VWZRK0lWZzRRbytMUkxXcmdzNHg1aTNjRndkVzJjbHlBMng1WXBQRTY5alBFTDBFN09GUXZ3UG9MZU5wU29aQmNHQXd6Uk1Jd2k3a2luQ2hJZUEySEt3PQ==';
    const res1 = await axios_1.default.get(`https://aniwaves.ru/ajax/sources?id=${encodeURIComponent(dubByfms)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': watchUrl, 'X-Requested-With': 'XMLHttpRequest' }
    });
    console.log('BYFMS:', res1.data);
    const res2 = await axios_1.default.get(`https://aniwaves.ru/ajax/sources?id=${encodeURIComponent(dubDghg)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': watchUrl, 'X-Requested-With': 'XMLHttpRequest' }
    });
    console.log('DGHG:', res2.data);
}
main();
