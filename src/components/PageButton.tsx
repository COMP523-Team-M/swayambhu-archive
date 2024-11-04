import React from 'react';
import styles from './PageButton.module.css';  // Import CSS module

const PageButton = ({ howMany, total, curPage, setCurrentPage }) => {
    const size = 5; // Maximum number of page links to display
    const totalPage = Math.ceil(total / howMany);
    const nextPage = curPage + 1;
    const prePage = curPage - 1;
    let pages = [];

    // Add first page link
    if (totalPage > 0) {
        pages.push(
            <button
                key="first"
                onClick={() => setCurrentPage(1)}
                className={`${styles['pagination-btn']} ${curPage === 1 ? styles.disabled : ''}`}
            >
                First Page
            </button>
        );
    }

    // Add previous page link
    if (prePage > 0) {
        pages.push(
            <button
                key="previous"
                onClick={() => setCurrentPage(prePage)}
                className={`${styles['pagination-btn']} ${curPage === 1 ? styles.disabled : ''}`}
            >
                Previous Page
            </button>
        );
    }

    // Middle page numbers
    if (totalPage <= size) {
        for (let i = 1; i <= totalPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`${styles['pagination-btn']} ${curPage === i ? styles.active : ''}`}
                >
                    {i}
                </button>
            );
        }
    } else {
        for (let i = curPage - Math.floor(size / 2), temp = curPage + size - Math.floor(size / 2); i < temp; i++) {
            if (i <= 0) {
                temp++;
            } // Adjust if index is out of bounds
            if (i > 0 && i <= totalPage) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`${styles['pagination-btn']} ${curPage === i ? styles.active : ''}`}
                    >
                        {i}
                    </button>
                );
            }
        }
    }

    // Add next page link
    if (nextPage <= totalPage) {
        pages.push(
            <button
                key="next"
                onClick={() => setCurrentPage(nextPage)}
                className={`${styles['pagination-btn']} ${curPage === totalPage ? styles.disabled : ''}`}
            >
                Next Page
            </button>
        );
    }

    // Add last page link
    if (totalPage > 0) {
        pages.push(
            <button
                key="last"
                onClick={() => setCurrentPage(totalPage)}
                className={`${styles['pagination-btn']} ${curPage === totalPage ? styles.disabled : ''}`}
            >
                Last Page
            </button>
        );
    }

    return (
        <div className={styles['pagination-container']}>
            {pages.map(function (item, index) {
                return item;
            })}
        </div>
    );
};

export default PageButton;
