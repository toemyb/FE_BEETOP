import React from "react";
import { Card, Button } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import "./ProductCard.css";
import { useNavigate } from "react-router-dom";
const { Meta } = Card;

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const changeProductDetail = () => {
        navigate(`/product-detail/${product.laptopID}`);
    };

    return (
        <Card
            hoverable
            className="product-card"
            cover={
                <img
                    alt={product.ten}
                    src={product.image ? "https://1pro.vn/wp-content/uploads/2025/01/Pro-1422-M1-gray-600x500.png" : 'https://1pro.vn/wp-content/uploads/2025/01/Pro-1422-M1-silver-600x500.png'    }
                    className="product-image"
                />
            }
            onClick={changeProductDetail}
        >
            <Meta
                title={`${product.productName} | ${product.cpu} | ${product.card} | ${product.memory} | ${product.resolution}`}
                description={<span className="product-price">{product.price.toLocaleString()} ₫</span>}
            />
            <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                className="add-to-cart-btn"
            >
                Thêm vào giỏ
            </Button>
        </Card>
    );
};

export default ProductCard;
