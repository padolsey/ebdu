import crypto from 'crypto';
class HashUtil {
    hashDocumentUrls(documentUrls) {
        const concatenatedUrls = documentUrls.sort().join('|');
        return this.hashString(concatenatedUrls);
    }
    hashString(input) {
        return crypto.createHash('sha256').update(input).digest('hex');
    }
}
export const hashUtil = new HashUtil();
//# sourceMappingURL=hashUtil.js.map