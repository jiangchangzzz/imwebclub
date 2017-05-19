import { clean } from 'node-xss';
import marked from '../../../server/common/marked';

exports.markdownRender = function(text) {
    return clean(marked(text || ''));
};